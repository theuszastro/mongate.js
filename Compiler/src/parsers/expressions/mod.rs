use crate::utils::HoistingBlock;
use std::mem::ManuallyDrop;

use crate::utils::{Expression, Pointer, Token};

mod array;
mod binary;
mod functionCall;
mod identifier;
mod logical;
mod number;
mod object;
mod regexp;
mod string;

pub fn expression(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<Expression> {
    let expr = match pointer.token.clone() {
        Some(Token::Undefined(_)) => {
            pointer.take("Undefined", true, true);

            Some(Expression::Undefined)
        }
        Some(Token::Null(_)) => {
            pointer.take("Null", true, true);

            Some(Expression::Null)
        }
        Some(Token::Identifier(_, _)) => identifier::identifier(pointer, body),
        Some(Token::Operator(op, _)) if op == "/" => regexp::regexp(pointer),
        Some(Token::Symbol(symbol, _)) => string::string(pointer, body, symbol),
        Some(Token::Number(num, _)) => number::number(pointer, body, num),
        Some(Token::Brackets(bracket, _)) => match bracket.as_str() {
            "[" => array::array(pointer, body),
            "{" => object::object(pointer, body),
            "(" => {
                pointer.take("Brackets", true, true);

                if let Some(expr) = expression(pointer, body) {
                    if pointer.take("Brackets", true, true).is_none() {
                        pointer.error("Expected ')'".to_string());
                    }

                    return Some(Expression::ParenBinary(Box::new(expr)));
                }

                None
            }
            _ => None,
        },
        _ => None,
    };

    expr
}
