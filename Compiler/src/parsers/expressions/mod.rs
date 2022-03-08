use std::mem::ManuallyDrop;

use crate::tokenizer::Token;
use crate::utils::pointer::Pointer;

mod array;
mod number;
mod object;
mod regexp;
mod string;

#[derive(Debug, Clone)]
pub enum Expression {
    Number(String),
    Identifier(String),
    String(String),
    Boolean(String),
    RegExp(String, String),
    Array(Vec<Expression>),
    Object(Vec<(String, Expression)>),
    ParenBinary(Box<Expression>),
    Binary(Box<Expression>, Token, Box<Expression>),
    FunctionArg(String, Option<Box<Expression>>),
    Null,
    Undefined,
}

pub fn expression(pointer: &mut ManuallyDrop<Pointer>) -> Option<Expression> {
    let expr = match pointer.token.clone() {
        Some(Token::Undefined(_)) => {
            pointer.take("Undefined", true, true);

            Some(Expression::Undefined)
        }
        Some(Token::Null(_)) => {
            pointer.take("Null", true, true);

            Some(Expression::Null)
        }
        Some(Token::Identifier(value, _)) => {
            pointer.take("Identifier", true, true);

            if ["true", "false"].contains(&value.as_str()) {
                return Some(Expression::Boolean(value));
            }

            Some(Expression::Identifier(value))
        }
        Some(Token::Brackets(bracket, _)) => match bracket.as_str() {
            "[" => array::array(pointer),
            "{" => object::object(pointer),
            "(" => {
                pointer.take("Brackets", true, true);

                let expr = expression(pointer);
                if let Some(expr) = expr {
                    let close = pointer.take("Brackets", true, true);

                    if close.is_none() {
                        pointer.error("Expected ')'".to_string());
                    }

                    return Some(Expression::ParenBinary(Box::new(expr)));
                }

                None
            }
            _ => None,
        },
        Some(Token::Operator(op, _)) if op == "/" => regexp::regexp(pointer),
        Some(Token::Symbol(symbol, _)) => string::string(pointer, symbol),
        Some(Token::Number(num, _)) => number::number(pointer, num),
        _ => None,
    };

    if let Some(Token::Punctuation(pun, _)) = pointer.token.clone() {
        if pun == ";" {
            pointer.take("Punctuation", true, true);
        }
    }

    expr
}
