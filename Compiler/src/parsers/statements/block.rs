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
            _ => {
                if let Some(stmt) = statements(pointer, body) {
                    body.current.push(ParsedToken::Statement(stmt));

                    continue;
                }

                if let Some(expr) = expression(pointer, body) {
                    match expr.clone() {
                        Expression::Identifier(name) => {
                            if findBody(body.clone(), name.clone()).is_none() {
                                pointer.error(format!("Identifier '{}' not declared", name));
                            }
                        }
                        _ => {}
                    }

                    body.current.push(ParsedToken::Expr(expr));
                }
            }
        }
    }
}
