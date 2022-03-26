use std::mem::ManuallyDrop;

use super::expression;
use crate::utils::{Expression, HoistingBlock, Pointer, Token};

pub fn logical(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
    left: Expression,
) -> Option<Expression> {
    let allowed = vec!["&&", "||", "==", "!=", "<", ">", "<=", ">="];

    if let Some(Token::LogicalOperator(op, _)) = pointer.take("LogicalOperator", false, false) {
        match pointer.token.clone() {
            Some(Token::LogicalOperator(op1, _)) => {
                let operator = format!("{}{}", op, op1);

                pointer.take("LogicalOperator", true, true);

                if !allowed.contains(&operator.as_str()) {
                    pointer.error(format!("Unexpected '{}'", operator.as_str()));
                }

                if let Some(expr) = expression(pointer, body) {
                    return Some(Expression::Logical(
                        Box::new(left),
                        operator,
                        Box::new(expr),
                    ));
                }

                pointer.error(format!("Unexpected a '{}'", operator))
            }
            _ => pointer.error(format!("Unexpected a '{}'", op)),
        }
    }

    if let Some(Token::Punctuation(punc, _)) = pointer.token.clone() {
        if !["=", "<", ">"].contains(&punc.as_str()) {
            return None;
        }

        pointer.take("Punctuation", true, true);

        match pointer.token.clone() {
            Some(Token::Punctuation(punc2, _)) => {
                let operator = format!("{}{}", punc, punc2);

                if allowed.contains(&operator.as_str()) {
                    pointer.take("Punctuation", true, true);

                    if let Some(expr) = expression(pointer, body) {
                        let logicalExpr = Expression::Logical(
                            Box::new(left.clone()),
                            operator,
                            Box::new(expr.clone()),
                        );

                        if let Some(logical) = logical(pointer, body, logicalExpr.clone()) {
                            return Some(logical);
                        }

                        return Some(logicalExpr);
                    }
                }

                pointer.error(format!("Unexpected '{}'", operator));
            }
            _ => {
                if allowed.contains(&punc.as_str()) {
                    if let Some(expr) = expression(pointer, body) {
                        let logicalExpr = Expression::Logical(
                            Box::new(left.clone()),
                            punc,
                            Box::new(expr.clone()),
                        );

                        if let Some(logical) = logical(pointer, body, logicalExpr.clone()) {
                            return Some(logical);
                        }

                        return Some(logicalExpr);
                    }
                }

                // if punc != ";" {
                //     pointer.error(format!("Unexpected '{}'", punc));
                // }
            }
        }
    }

    None
}
