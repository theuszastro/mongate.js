use std::mem::ManuallyDrop;

use super::{expression, statements};
use crate::utils::{
    ExportedModule, Expression, HoistingBlock, ParsedToken, Pointer, StatementToken, Token,
};

fn alreadyExported(
    pointer: &mut ManuallyDrop<Pointer>,
    export: Option<ParsedToken>,
    isDefault: bool,
) -> bool {
    for exported in pointer.exports.iter() {
        if export.is_none() {
            if exported.isDefault == isDefault {
                return true;
            }
        } else {
            if let Some(ref export) = export {
                if exported.isDefault == isDefault && export == &exported.token {
                    return true;
                }
            }
        }
    }

    return false;
}

pub fn export(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<StatementToken> {
    pointer.take("Keyword", true, true);

    let mut isDefault = false;

    match pointer.token.clone() {
        Some(Token::Keyword(key, _)) if key == "default" => {
            pointer.take("Keyword", true, true);

            isDefault = true;
        }
        _ => {}
    }

    if let Some(expr) = expression(pointer, body) {
        match expr {
            Expression::Identifier(name) => {
                let token = ParsedToken::Expr(Expression::Identifier(name.clone()));
                if isDefault && alreadyExported(pointer, None, true) {
                    pointer.error(format!("Default export already declared"));
                }

                if !alreadyExported(pointer, Some(token.clone()), isDefault) {
                    pointer.exports.push(ExportedModule {
                        isDefault,
                        token: token.clone(),
                    });

                    return Some(StatementToken::ExportDeclaration(
                        Box::new(token),
                        isDefault,
                    ));
                }

                pointer.error("Already exported".to_string());
            }
            _ => {
                pointer.error("Expected identifier".to_string());
            }
        }

        return None;
    }

    let state = statements(pointer, body);
    match state.clone() {
        Some(StatementToken::FunctionDeclaration(..))
        | Some(StatementToken::VariableDeclaration(..))
        | Some(StatementToken::ConstantDeclaration(..)) => {
            let token = ParsedToken::Statement(state.unwrap());

            if isDefault && alreadyExported(pointer, None, true) {
                pointer.error(format!("Default export already declared"));
            }

            if !alreadyExported(pointer, Some(token.clone()), isDefault) {
                body.current.push(token.clone());

                pointer.exports.push(ExportedModule {
                    isDefault,
                    token: token.clone(),
                });

                return Some(StatementToken::ExportDeclaration(
                    Box::new(token),
                    isDefault,
                ));
            }

            pointer.error("already exported".to_string());

            None
        }
        _ => {
            pointer.error("invalid export".to_string());

            return None;
        }
    }
}
