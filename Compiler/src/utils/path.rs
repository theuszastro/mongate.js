use std::mem::ManuallyDrop;
use std::path::PathBuf;

use regex::Regex;

use crate::utils::{Expression, ImportedModule, ParsedToken, Pointer, StatementToken, Token};
use crate::{Compiler, CompilerConfig};

pub fn isLibrary(path: String) -> bool {
    return !(path.starts_with("./") | path.starts_with("../"));
}

pub fn getPath(pointer: &mut ManuallyDrop<Pointer>, filePath: String) -> String {
    let regex = Regex::new(r"^\.{1,2}/(.+)").unwrap();

    let mut path = regex.replace(filePath.as_str(), "$1").to_string();
    path.push_str(".nylock");

    let regex = Regex::new(r"(.+)/$").unwrap();

    let last = path.split("/").last().unwrap();
    let replaced = path.replace(last, "");
    let newPath = regex.replace(replaced.as_str(), "$1").to_string();

    let folder = pointer.folder.clone();

    if folder.is_empty() {
        pointer.folder = newPath.clone();

        return format!("{}/{}", pointer.executable, path);
    }

    pointer.folder = format!("{}/{}", folder, newPath);

    return format!("{}/{}/{}", pointer.executable, folder, path);
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

    let mut hasDefault = false;

    for export in body
        .iter()
        .filter(|token| match token {
            ParsedToken::Statement(StatementToken::ExportDeclaration(..)) => true,
            _ => false,
        })
        .map(|x| x.clone())
    {
        match export {
            ParsedToken::Statement(token) => match token.clone() {
                StatementToken::ExportDeclaration(exportDefault, token) => {
                    if let Some(d) = exportDefault {
                        hasDefault = true;

                        continue;
                    }

                    match *token {
                        ParsedToken::Statement(
                            StatementToken::VariableDeclaration(name, ..)
                            | StatementToken::FunctionDeclaration(name, ..)
                            | StatementToken::ConstantDeclaration(name, ..),
                        ) => {
                            if names.contains(&name) {
                                continue;
                            }

                            pointer.error(format!("Export declaration '{}' is not exported", name));
                        }
                        ParsedToken::Expr(Expression::Identifier(name)) => {
                            if names.contains(&name) {
                                continue;
                            }

                            pointer.error(format!("Export declaration '{}' is not exported", name));
                        }
                        _ => {}
                    }
                }
                _ => {}
            },
            _ => {}
        }
    }

    if default.is_some() {
        if !hasDefault {
            pointer.error("Export default not found".to_string());
        }
    }
}

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
                pathBuf,
                format!("{}/{}", pointer.folder, name),
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
