use std::mem::ManuallyDrop;

use crate::parsers::expression;
use crate::utils::{Expression, HoistingBlock, Pointer, Token};

pub fn binary(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
    left: Expression,
) -> Option<Expression> {
    if let Some(Token::Operator(data, _)) = pointer.previewNext(false, false) {
        if let Some(Token::Operator(operator, _)) = pointer.token.clone() {
            if data == "/" && operator == "/" {
                return Some(left);
            }
        }
    }

    if let Some(Token::Operator(operator, _)) = pointer.take("Operator", true, true) {
        if let Some(right) = expression(pointer, body) {
            return Some(Expression::Binary(
                Box::new(left),
                operator,
                Box::new(right),
            ));
        }

        if let Some(value) = pointer.token.clone() {
            pointer.error(format!("Unexpected '{}'", value.tokenValue()));
        } else {
            pointer.error("Expected a right value".to_string());
        }
    }

    None
}
