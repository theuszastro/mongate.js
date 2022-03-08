use std::mem::ManuallyDrop;

use crate::parsers::{expression, Expression, StatementToken};
use crate::utils::pointer::Pointer;

pub fn variable(
    pointer: &mut ManuallyDrop<Pointer>,
    names: &mut Vec<String>,
    isConstant: bool,
) -> Option<StatementToken> {
    pointer.take("Keyword", true, true, true);

    if let Some(name) = pointer.take("Identifier", true, true, true) {
        if names.contains(&name.tokenValue()) {
            pointer.error(format!(
                "Identifier '{}' already declared",
                name.tokenValue()
            ));
        }

        names.push(name.tokenValue());

        if let Some(assign) = pointer.take("Punctuation", true, true, true) {
            if assign.tokenValue() == "=" {
                let expr = expression(pointer);

                if let Some(expr) = expr {
                    if isConstant {
                        return Some(StatementToken::ConstantDeclaration(name, expr));
                    } else {
                        return Some(StatementToken::VariableDeclaration(name, expr));
                    }
                }

                pointer.error("Expected expression".to_string());
            }

            pointer.error("Expected '='".to_string());
        } else {
            if isConstant {
                return Some(StatementToken::ConstantDeclaration(
                    name,
                    Expression::Undefined,
                ));
            } else {
                return Some(StatementToken::VariableDeclaration(
                    name,
                    Expression::Undefined,
                ));
            }
        }
    }

    pointer.error("Expected a variable name".to_string());

    None
}
