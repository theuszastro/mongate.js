use std::mem::ManuallyDrop;

use super::expression;
use crate::utils::{Expression, HoistingBlock, Pointer, Token};

pub fn logical(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
    left: Expression,
) -> Option<Expression> {
    let allowed = vec!["&&", "||", "==", "!=", "<", ">", "<=", ">="];
    let allowedSymbols = vec!["&", "|", "=", "!", "<", ">"];

    let mut operator = String::from("");

    loop {
        match pointer.token.clone() {
            Some(Token::Punctuation(punc, _)) if allowedSymbols.contains(&punc.as_str()) => {
                pointer.take("Punctuation", false, false);

                operator.push_str(&punc);
            }
            Some(Token::LogicalOperator(op, _)) if allowedSymbols.contains(&op.as_str()) => {
                pointer.take("LogicalOperator", false, false);

                operator.push_str(&op)
            }
            _ => break,
        }
    }

    if allowed.contains(&operator.as_str()) {
        pointer.take("NewLine", true, true);
        pointer.take("Whitespace", true, true);

        if let Some(expr) = expression(pointer, body) {
            let logicalExpr =
                Expression::Logical(Box::new(left.clone()), operator, Box::new(expr.clone()));

            if let Some(logical) = logical(pointer, body, logicalExpr.clone()) {
                return Some(logical);
            }

            return Some(logicalExpr);
        }
    }

    if !operator.is_empty() {
        pointer.error(format!("Unexpected '{}'", operator));
    }

    None
}
