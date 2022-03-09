use std::mem::ManuallyDrop;

use super::expression;

use crate::utils::{Expression, HoistingBlock, Pointer, Token};

pub fn array(pointer: &mut ManuallyDrop<Pointer>, body: &mut HoistingBlock) -> Option<Expression> {
    pointer.take("Brackets", true, true);

    let mut values: Vec<Expression> = vec![];

    loop {
        match pointer.token.clone() {
            Some(Token::Brackets(bra, _)) if bra == "]" => break,
            _ => {
                if let Some(expr) = expression(pointer, body) {
                    values.push(expr);

                    match pointer.token.clone() {
                        Some(Token::Punctuation(pun, _)) => {
                            if pun == "," {
                                pointer.next(true, true);

                                continue;
                            }

                            break;
                        }
                        _ => {
                            if expression(pointer, body).is_some() {
                                pointer.error("Expected ','".to_string());
                            }
                        }
                    }

                    continue;
                }

                match pointer.token.clone() {
                    Some(Token::Brackets(bra, _)) if bra == "]" => break,
                    Some(Token::Punctuation(pun, _)) if pun == "," => {
                        pointer.take("Punctuation", true, true);

                        values.push(Expression::Undefined);

                        continue;
                    }
                    _ => {}
                }

                break;
            }
        }
    }

    let close = pointer.take("Brackets", true, true);
    if close.is_none() || close.unwrap().tokenValue() != "]" {
        pointer.error("Expected ']'".to_string());
    }

    Some(Expression::Array(values))
}
