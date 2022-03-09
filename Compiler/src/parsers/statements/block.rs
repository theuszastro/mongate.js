use std::mem::ManuallyDrop;

use crate::parsers::{expression, statements};
use crate::utils::findBody;
use crate::utils::{Expression, HoistingBlock, ParsedToken, Pointer, Token};

pub fn readBlock(pointer: &mut ManuallyDrop<Pointer>, body: &mut HoistingBlock) {
    loop {
        match pointer.token.clone() {
            Some(Token::Brackets(brack, _)) if brack == "}" => {
                pointer.take("Brackets", true, true);

                break;
            }
            Some(Token::Keyword(key, _)) => {
                if let Some(stmt) = statements(pointer, body, key) {
                    body.current.push(ParsedToken::Statement(stmt));

                    continue;
                }

                break;
            }
            _ => {
                if let Some(expr) = expression(pointer) {
                    match expr.clone() {
                        Expression::Identifier(name) => {
                            let exists = findBody(body.clone(), name.clone());
                            if exists.is_none() {
                                pointer.error(format!("Identifier '{}' not declared", name));
                            }
                        }
                        _ => {}
                    }

                    body.current.push(ParsedToken::Expr(expr));

                    continue;
                }
            }
        }
    }
}
