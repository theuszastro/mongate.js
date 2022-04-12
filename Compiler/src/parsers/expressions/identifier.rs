use std::mem::ManuallyDrop;

use super::{binary::binary, functionCall::functionCall, logical::logical};
use crate::utils::{findBody, findGlobalFunc, findImports};
use crate::utils::{Expression, HoistingBlock, Pointer, Token};

pub fn identifier(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<Expression> {
    if let Some(Token::Identifier(value, _)) = pointer.token.clone() {
        if let Some(call) = functionCall(pointer, body) {
            return Some(call);
        }

        pointer.take("Identifier", true, true);

        if ["true", "false"].contains(&value.as_str()) {
            let expr = Expression::Boolean(value);

            if let Some(logical) = logical(pointer, body, expr.clone()) {
                return Some(logical);
            }

            return Some(expr);
        }

        if !findImports(&pointer.imports, value.clone())
            && findGlobalFunc(&pointer.globalFunctions, value.clone()).is_none()
            && findBody(body.clone(), value.clone()).is_none()
        {
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
