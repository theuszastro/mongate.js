mod pointer;
mod structs;

pub use pointer::{ImportedModule, Pointer};
pub use structs::{Expression, HoistingBlock, ParsedToken, StatementToken, Token, TokenContext};

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
