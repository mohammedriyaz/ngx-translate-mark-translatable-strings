# ngx-translate-mark-translatable-strings

Tool to mark tags which has only strings with [translate] directive. Like ngx-translate-extract, this tool will mark the strings, so it save your time to manually mark the string only tags with [translatae] directive.

This Tool will 
 * Find the angular component.html files 
 * Identify the tags those only have text nodes
 * Genarate unique translate key using file path and idendified tag content
 
    ex. Lets say, angular has app/components/test/test.component.html
    ```
       -> <h1>Mark All Translatable Strings</h1>
    ```
       
     ngx-translate-mark-translatable-strings will generate key for text only tag h1 like
     ``` 
        "components.test.test-component.Mark_All_Translatable_Strings"
     ```
    Leaf key length will be based on give -k command line config. by default its 50 chars legnth


## Installation

Install this tool globally, so that it will be available from anywhere

```
npm i -g ngx-translate-mark-translatable-strings
```

## Usage

```
ngx-translate-mark-translatable-strings -d <path_to_angular_components> -k <key_length>
```

ex.

```
ngx-translate-mark-translatable-strings -d ./app/ -k 25
```
OR
```
ngx-translate-mark-translatable-strings -d ./app/
```

## Author

* **Mohammed Riyaz**
