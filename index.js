'use strict';

const fif = require('find-in-files'),
    path = require('path'),
    fs = require('fs');
let transKeyLen = 50;

function revertAllChanges(templateFilePath) {
    removeFile(templateFilePath + "_back", {
        err: "error deleting the component back file. please do it manually. file: " + templateFilePath + "_back",
        success: "successfully removed component backup file. file: " + templateFilePath + "_back"
    });
}

function removeFile(path, messages) {
    fs.unlink(path, (err) => {
        if (err) {
            console.log(messages.err);
        } else {
            console.log(messages.success);
        }
    });
}

function takeFileBackupAndMigrate(templateFilePath, matches) {
    let transUpdates = true,
        fileTransCount = 0;
    for (let m=matches.length-1; m>=0; m--) {
        if (matches[m].match(/\[translate]/i)) {
            matches.splice(m, 1);
            fileTransCount++;
        }
    }
    if (!matches.length) {
        console.log("already file updated with translate directives. File: " +templateFilePath);
        return;
    }
    if (fs.copyFile) {
        fs.copyFile(templateFilePath, templateFilePath + "_back", (err) => {
            if (err) {
                console.log("failed to back up component file, so it's skipping the process for this file. File: " +templateFilePath);
                return;
            } else {

                console.log('Successfully backed up the component file. File: ' +templateFilePath);
                updateFileWithTranslateDirectives(templateFilePath, matches, fileTransCount);
            }
        });
    }
}

function updateFileWithTranslateDirectives(templateFilePath, matches, fileTransKeyCount) {
    let fileName = path.basename(templateFilePath),
        filePath = path.dirname(templateFilePath);
    if (fileName.match(/(\.component\.html)$/)) {
        fs.readFile(templateFilePath, 'utf-8', (err, data) => {
            if (err) {
                console.log("error reading component file. filepath:" + templateFilePath);
                console.log("reverting backup file. filepath:" + templateFilePath +"_back");
                revertAllChanges(templateFilePath);
            } else {
                let pat = /<(.+)( [^>]*)?>([^<>]+)<\/\1>/i,
                    editedContent = data, jsonNS = "",
                    urlMat = /(components)\/[^\\]+\//ig.exec(templateFilePath),
                    keyCnt = (fileTransKeyCount && fileTransKeyCount+1) || 1,
                    fileKey = fileName.replace("html", "").replace(".component", "-component");

                if (Array.isArray(urlMat) && urlMat.length) {
                    jsonNS = urlMat[0].replace(/\//g,".");
                }
                for (let i=0, len=matches.length; i<len; i++ ) {
                    let mat = matches[i].match(pat);
                    if (Array.isArray(mat) && mat.length) {
                        let doesGroup2MatchEndTag = false,
                            grp2Matches,
                            grp2MatchPat = new RegExp(">([^><]+)</" + mat[1], "i"),
                            erroneousMatch;
                        if (mat[2] && (grp2Matches = mat[2].match(grp2MatchPat))) {
                            if (grp2Matches.length === 2) {
                                erroneousMatch = mat[3];
                                mat[3] = grp2Matches[1];
                                mat[2] = mat[2].replace(grp2MatchPat, "");
                                doesGroup2MatchEndTag = true;
                            }
                        }
                        if (!mat[3] ? true : (mat[3].replace(/[\s]*\{\{[^}}]+}}[\s]*/g, "") === "")) {
                            continue;
                        }
                        let transKey=getKey(mat[3]||"");
                        if (data.match(new RegExp("'" +jsonNS + fileKey + transKey + "'"))) {
                            transKey += "_" + Math.floor(Math.random()*10000);
                        }

                        let transDirStr = `<${mat[1]}${mat[2] || ""} [translate]="'${jsonNS + fileKey + transKey}'">${mat[3]}</${mat[1]}>`;
                        if (mat[2] && mat[2].match(/(mat-(raised-|stroked-|flat-|mini-)?(button|fab)|mat-sort-header)/i)) {
                            transDirStr = `<${mat[1]}${mat[2] || ""}><span [translate]="'${jsonNS + fileKey + transKey}'">${mat[3]}</span></${mat[1]}>`;
                        }
                        if (doesGroup2MatchEndTag) {
                            transDirStr += `${erroneousMatch}</${mat[1]}>`;
                        }
                        keyCnt++;
                        editedContent = editedContent.replace(matches[i], transDirStr);
                        mat.splice(0);
                    }
                }

                fs.writeFile(templateFilePath, editedContent, 'utf-8', function (err) {
                    if (err) {
                        console.log("error editing the file. File: "+ templateFilePath);
                        console.log('removing templates backup. File: ' + templateFilePath + "_back");
                        revertAllChanges(templateFilePath);
                    } else {
                        console.log('successfully updated file with translate directives with random keys. File: ' + templateFilePath);
                        console.log('removing templates backup. File: ' + templateFilePath + "_back");
                        revertAllChanges(templateFilePath);
                    }

                });
            }
        });
    }
    return false;
}

function getKey(str) {
    let onlyCharsSpaces = (str && str.replace(/[^\w\s]+/g, "")) || "",
        strArr = onlyCharsSpaces.split(/[\s]+/),
        strLen = onlyCharsSpaces.length;
    if (strLen < transKeyLen) {
        return strLen === 0 ? "rand_" + Math.floor(Math.random()*10000) : onlyCharsSpaces.replace(/[\s]+/g,"_");
    } else {
        return strLen === 0 ? "rand_" + Math.floor(Math.random()*10000) : onlyCharsSpaces.replace(/[\s]+/g,"_").substr(0, transKeyLen-1);
    }
}

exports.markWithTranslateDirective = function(dir, fileFilter, keyLen) {
    let processedFileCount = 0;
    transKeyLen = keyLen;
    console.log("Migration Process started ..... ");
    if (typeof dir !== "string") {
        console.log("invalid directory value");
        return;
    }
    fif.find({term:"<(.+)( [^>]*)?>([^><]+)(<\/\\1>){1,1}", flags: "gi"}, dir, fileFilter||"component.html$")
        .then(function(results) {
            for (var result in results) {
                var res = results[result];
                if (Array.isArray(res.matches) && res.matches.length) {
                    takeFileBackupAndMigrate(result, res.matches.slice(0));
                } else {
                    console.log("No string only tags found or it's already marked with translate directive. Component: " + result);
                }
                processedFileCount++;
            }

        })
        .finally(()=>{
            if (!processedFileCount) {
                console.log("No component.html files need to mark with translate directive. Hope you are good!:)");
            }
        });
}


