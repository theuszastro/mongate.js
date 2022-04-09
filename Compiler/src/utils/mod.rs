mod path;
mod pointer;
mod structs;

pub use path::{existsFile, getPath, verifyImport};
pub use pointer::{GlobalFunc, ImportedModule, Pointer};
pub use structs::{Expression, HoistingBlock, ParsedToken, StatementToken, Token, TokenContext};

pub fn formatFunctionName(name: String, globalFun: Option<GlobalFunc>) -> String {
    if let Some(GlobalFunc {
        name: funcName,
        replace,
        ..
    }) = globalFun
    {
        if replace.is_empty() {
            return funcName;
        }

        return replace;
    }

    return name;
}

pub fn findGlobalFunc(functions: &Vec<GlobalFunc>, name: String) -> Option<GlobalFunc> {
    for func in functions {
        if func.name == name {
            return Some(func.clone());
        }
    }

    return None;
}

pub fn findImports(imports: &Vec<ImportedModule>, name: String) -> bool {
    for import in imports {
        for iName in &import.names {
            if let Token::Identifier(tName, ..) = iName {
                if tName.clone() == name {
                    return true;
                }
            }
        }
    }

    return false;
}

pub fn findBody(body: HoistingBlock, searchName: String) -> Option<ParsedToken> {
    let HoistingBlock { block, current } = body;

    let exists = findName(&current, searchName.clone());
    if exists.is_none() {
        if let Some(avoiding) = *block {
            return findBody(avoiding, searchName);
        }

        return None;
    }

    return exists;
}

pub fn findName(body: &Vec<ParsedToken>, searchName: String) -> Option<ParsedToken> {
    let mut token: Option<ParsedToken> = None;

    for parsed in body {
        match parsed.clone() {
            ParsedToken::Statement(stmt) => match stmt {
                StatementToken::VariableDeclaration(name, _)
                | StatementToken::ConstantDeclaration(name, _)
                | StatementToken::FunctionDeclaration(name, _, _, _) => {
                    if name == searchName {
                        token = Some(parsed.clone());

                        break;
                    }
                }
                _ => {}
            },
            ParsedToken::Expr(expr) => {
                if let Expression::FunctionArg(name, _) = expr {
                    if name == searchName {
                        token = Some(parsed.clone());

                        break;
                    }
                }
            }
        }
    }

    token
}
