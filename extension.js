// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const yaml = require('js-yaml');
const validator = require('oas-validator');
const converter = require('swagger2openapi');

function convert(yamlMode) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('You must have an open editor window to convert an OpenAPI document');
        return; // No open text editor
    }
    converter.convertStr(editor.document.getText(),{ patch: true, warnOnly: true }, function(err, options) {
        if (yamlMode) {
            vscode.workspace.openTextDocument({ language: 'yaml', content: yaml.safeDump(options.openapi) })
            .then(function(doc) {
                vscode.window.showTextDocument(doc);
            })
            .catch(function(ex){
                console.error(ex);
            });
        }
        else {
            vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(options.openapi, null, 2)})
            .then(function(doc) {
                vscode.window.showTextDocument(doc);
            })
            .catch(function(ex){
                console.error(ex);
            });
        }
    });
}

function translate(yamlMode) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('You must have an open editor window to convert an OpenAPI document');
        return; // No open text editor
    }

    let text = editor.document.getText();
    try {
        let obj = yaml.safeLoad(text,{ json: true });
        let out = '';
        if (yamlMode) {
            out = yaml.safeDump(obj);
        }
        else {
           out = JSON.stringify(obj, null, 2);
        }
        editor.edit(builder => {
			const document = editor.document;
			const lastLine = document.lineAt(document.lineCount - 2);

			const start = new vscode.Position(0, 0);
			const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);

            builder.replace(new vscode.Range(start, end), out);
        });
    }
    catch (ex) {
        vscode.window.showErrorMessage('Could not parse OpenAPI document!\n'+ex.message);
    }
}

function validate(lint) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('You must have an open editor window to validate an OpenAPI document');
        return; // No open text editor
    }

    let text = editor.document.getText();
    try {
    	let options = { lint: lint };
        let obj = yaml.safeLoad(text,{ json: true });
	    let result = false;
        try {
            result = validator.validateSync(obj, options);
          	vscode.window.showInformationMessage('Your OpenAPI document is valid!');
	    	return;
        }
	    catch (ex) {
	    	let message = 'Your OpenAPI document is not valid :(\n';
	    	if (options.context) message += options.context.pop()+'\n';
	    	message += ex.message;
        	vscode.window.showErrorMessage(message);
	    }
    }
    catch (ex) {
        vscode.window.showErrorMessage('Could not parse OpenAPI document!');
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let cmdValidate = vscode.commands.registerCommand('extension.openapi-validate', function () {
        // The code you place here will be executed every time your command is executed
    	validate(false);
    });

    let cmdLint = vscode.commands.registerCommand('extension.openapi-lint', function () {
        // The code you place here will be executed every time your command is executed
    	validate(true);
    });

    let cmdTranslateToJson = vscode.commands.registerCommand('extension.openapi-to-json', function() {
        translate(false);
    });

    let cmdTranslateToYaml = vscode.commands.registerCommand('extension.openapi-to-yaml', function() {
        translate(true);
    });

    let cmdConvertJson = vscode.commands.registerCommand('extension.openapi-convert-json', function() {
        convert(false);
    });

    let cmdConvertYaml = vscode.commands.registerCommand('extension.openapi-convert-yaml', function() {
        convert(true);
    });

    context.subscriptions.push(cmdValidate);
    context.subscriptions.push(cmdLint);
    context.subscriptions.push(cmdConvertJson);
    context.subscriptions.push(cmdConvertYaml);
    context.subscriptions.push(cmdTranslateToJson);
    context.subscriptions.push(cmdTranslateToYaml);

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "openapi-lint" activated. '+context.subscriptions.length);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
