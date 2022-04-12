use std::mem::ManuallyDrop;
use std::path::PathBuf;

use super::{getPath, isLibrary};

use crate::utils::{Expression, ImportedModule, ParsedToken, Pointer, StatementToken, Token};
use crate::{Compiler, CompilerConfig};

pub fn verifyImport(
    pointer: &mut ManuallyDrop<Pointer>,
    default: Option<String>,
    names: Vec<Token>,
    path: String,
) {
    if path.starts_with("../") | path.starts_with("./") {
        let pathBuf = PathBuf::from(getPath(pointer, path.clone()));

        if pathBuf.exists() {
            let mut name = path.split("/").last().unwrap().to_string();
            name.push_str(".nylock");

            let mut compiler = Compiler::new(CompilerConfig::new(
                pathBuf.clone(),
                pathBuf.to_str().unwrap().replace(&pointer.executable, ""),
                pointer.isNode,
                pointer.es6,
            ));

            let (code, tokens, imports) = compiler.run();
            verifyExports(pointer, tokens, names.clone(), default.clone());

            pointer.imports.push(ImportedModule {
                names,
                default,
                imports: Box::new(imports),
                path: path.clone(),
                code: code.clone(),
                isLibrary: isLibrary(path.clone()),
            });

            return;
        }

        pointer.error(format!("file '{}' not found", path));
    }
}

fn exportsToNames(exports: &Vec<ParsedToken>) -> Vec<String> {
    exports
        .iter()
        .filter(|export| match export {
            ParsedToken::Statement(token) => match token.clone() {
                StatementToken::ExportDeclaration(exportDefault, token) => {
                    if exportDefault.is_some() {
                        return false;
                    }
                    match *token {
                        ParsedToken::Statement(
                            StatementToken::VariableDeclaration(..)
                            | StatementToken::FunctionDeclaration(..)
                            | StatementToken::ConstantDeclaration(..),
                        ) => {
                            return true;
                        }
                        ParsedToken::Expr(Expression::Identifier(_)) => {
                            return true;
                        }
                        _ => {
                            return false;
                        }
                    }
                }
                _ => {
                    return false;
                }
            },
            _ => {
                return false;
            }
        })
        .map(|x| match x {
            ParsedToken::Statement(StatementToken::ExportDeclaration(_, token)) => {
                match *token.clone() {
                    ParsedToken::Statement(
                        StatementToken::VariableDeclaration(name, ..)
                        | StatementToken::FunctionDeclaration(name, ..)
                        | StatementToken::ConstantDeclaration(name, ..),
                    ) => {
                        return name.clone();
                    }
                    ParsedToken::Expr(Expression::Identifier(name)) => {
                        return name.clone();
                    }
                    _ => {
                        return String::new();
                    }
                }
            }
            _ => {
                return String::new();
            }
        })
        .collect::<Vec<String>>()
}

fn verifyExports(
    pointer: &mut ManuallyDrop<Pointer>,
    body: Vec<ParsedToken>,
    names: Vec<Token>,
    default: Option<String>,
) {
    let names = names
        .iter()
        .map(|x| x.tokenValue())
        .collect::<Vec<String>>();

    let exports = body
        .iter()
        .filter(|token| match token {
            ParsedToken::Statement(StatementToken::ExportDeclaration(..)) => true,
            _ => false,
        })
        .map(|x| x.clone())
        .collect::<Vec<ParsedToken>>();

    let defaultExport = exports.iter().find(|x| match x {
        ParsedToken::Statement(StatementToken::ExportDeclaration(export, ..)) => export.is_some(),
        _ => false,
    });

    let exportsNames = exportsToNames(&exports);

    for name in &names {
        if !exportsNames.contains(&name.clone()) {
            pointer.error(format!("Export '{}' is not exported", name,));
        }
    }

    if default.is_some() && defaultExport.is_none() {
        pointer.error("Export default not found".to_string());
    }
}
