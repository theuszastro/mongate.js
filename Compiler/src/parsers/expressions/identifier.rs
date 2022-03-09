use std::mem::ManuallyDrop;

use crate::parsers::expression;
use crate::utils::{findBody, Expression, HoistingBlock, Pointer, Token};

pub fn identifier(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<Expression> {
    if let Some(Token::Identifier(value, _)) = pointer.take("Identifier", true, true) {
        if ["true", "false"].contains(&value.as_str()) {
            return Some(Expression::Boolean(value));
        }

        if let None = findBody(body.clone(), value.clone()) {
            pointer.error(format!("Identifier '{}' not declared", value));
        }

        if let Some(data) = pointer.previewNext(false, false) {
            if let Some(Token::Operator(operator, _)) = pointer.token.clone() {
                if data.tokenValue() == "/" && operator == "/" {
                    return Some(Expression::Identifier(value));
                }
            }
        }

        if let Some(operator) = pointer.take("Operator", true, true) {
            if let Some(right) = expression(pointer, body) {
                return Some(Expression::Binary(
                    Box::new(Expression::Identifier(value)),
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

        return Some(Expression::Identifier(value));
    }

    None
}
