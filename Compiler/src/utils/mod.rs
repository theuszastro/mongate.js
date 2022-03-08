use crate::parsers::{Expression, ParsedToken, StatementToken};

pub mod pointer;

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
