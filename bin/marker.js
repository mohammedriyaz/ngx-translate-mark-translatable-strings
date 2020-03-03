#!/usr/bin/env node
var marker = require("../index");

const optionDefinitions = [
    { name: 'dir', alias: 'd', type: String },
    { name: 'fileFilter', type: String, alias: 'f', defaultOption: "*.ts" },
    { name: 'translateKeyLength', type: Number, alias: 'k', defaultOption: 50 }
]

const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions);

marker.markWithTranslateDirective((options && options.dir) || "./",
    (options && options.fileFilter) || "",
    (options && options.translateKeyLength) || 50);
