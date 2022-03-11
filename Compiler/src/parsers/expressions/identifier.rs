use std::mem::ManuallyDrop;

use super::{binary::binary, logical::logical};
use crate::utils::{findBody, Expression, HoistingBlock, Pointer, Token};

pub fn identifier(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<Expression> {
    if let Some(Token::Identifier(value, _)) = pointer.take("Identifier", true, true) {
        if ["true", "false"].contains(&value.as_str()) {
            let expr = Expression::Boolean(value);

            if let Some(logical) = logical(pointer, body, expr.clone()) {
                return Some(logical);
            }

            return Some(expr);
        }

        if let None = findBody(body.clone(), value.clone()) {
            pointer.error(format!("Identifier '{}' not declared", value));
        }

        let expr = Expression::Identifier(value.clone());

        if let Some(logic) = logical(pointer, body, expr.clone()) {
            return Some(logic);
        }

        if let Some(binary) = binary(pointer, body, expr.clone()) {
            return Some(binary);
        }

        return Some(expr);
    }

    None
}
