use std::env::current_dir;
use std::mem::ManuallyDrop;
use std::path::PathBuf;

use crate::utils::{Expression, ImportedModule, ParsedToken, Pointer, StatementToken, Token};
use crate::{Compiler, CompilerConfig};

pub fn isLibrary(path: String) -> bool {
    return !(path.starts_with("./") | path.starts_with("../"));
}

pub fn getPath(filePath: String) -> String {
    let mut executable = current_dir().unwrap().to_str().unwrap().to_string();

    executable = executable.replace("/target/debug/Compiler", "");
    executable = executable.replace("/target/release/Compiler", "");

    let mut path = filePath.replace("./", "");
    path.push_str(".nylock");

    return format!("{}/{}", executable, path);
}

pub fn existsFile(path: String) -> bool {
    let path = getPath(path);

    let newPath = PathBuf::from(path);

    return newPath.exists();
}

fn parseExports(body: Vec<ParsedToken>) -> Vec<String> {
    body.iter()
        .filter(|token| match token {
            ParsedToken::Statement(StatementToken::ExportDeclaration(..)) => true,
            _ => false,
        })
        .map(|x| match x {
            ParsedToken::Statement(token) => match token.clone() {
                StatementToken::ExportDeclaration(token, ..) => match *token {
                    ParsedToken::Statement(
                        StatementToken::VariableDeclaration(name, ..)
                        | StatementToken::FunctionDeclaration(name, ..)
                        | StatementToken::ConstantDeclaration(name, ..),
                    ) => name,
                    ParsedToken::Expr(Expression::Identifier(name)) => name,
                    _ => "".to_string(),
                },
                _ => unreachable!(),
            },
            _ => unreachable!(),
        })
        .collect::<Vec<String>>()
}

pub fn verifyImport(pointer: &mut ManuallyDrop<Pointer>, names: Vec<Token>, path: String) {
    if path.starts_with("../") | path.starts_with("./") {
        if existsFile(path.clone()) {
            let mut name = path.split("/").last().unwrap().to_string();
            name.push_str(".nylock");

            let mut compiler = Compiler::new(CompilerConfig::new(
                std::path::PathBuf::from(getPath(path.clone())),
                name.clone().to_string(),
                pointer.isNode,
                pointer.es6,
            ));

            let (code, tokens, imports) = compiler.run();
            let exports = parseExports(tokens);

            for name in &names {
                if exports.contains(&name.tokenValue()) {
                    continue;
                }

                pointer.error(format!("Import '{}' not found", name.tokenValue()));
            }

            pointer.imports.push(ImportedModule {
                names,
                imports: Box::new(imports),
                exports,
                path: path.clone(),
                code: code.clone(),
                isLibrary: isLibrary(path.clone()),
            });

            return;
        }

        pointer.error(format!("file '{}' not found", path));
    }
}
