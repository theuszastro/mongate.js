use std::mem::ManuallyDrop;

use super::{expression, Expression};

use crate::tokenizer::Token;
use crate::utils::pointer::Pointer;

pub fn array(pointer: &mut ManuallyDrop<Pointer>) -> Option<Expression> {
    pointer.take("Brackets", true, true);

    let mut values: Vec<Expression> = vec![];

    loop {
        match pointer.token.clone() {
            Some(Token::Brackets(bra, _)) if bra == "]" => break,
            _ => {
                let expr = expression(pointer);
                if let Some(expr) = expr {
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
                            let expr = expression(pointer);
                            if expr.is_some() {
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
