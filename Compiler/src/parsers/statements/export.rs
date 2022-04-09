use std::mem::ManuallyDrop;

use super::statements;
use crate::utils::{HoistingBlock, Pointer, StatementToken};

// fn readNamedExport(pointer: &mut ManuallyDrop<Pointer>, body: &mut HoistingBlock) {}

pub fn export(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<StatementToken> {
    pointer.take("Keyword", true, true);

    let state = statements(pointer, body);

    match state.clone() {
        Some(StatementToken::FunctionDeclaration(..))
        | Some(StatementToken::VariableDeclaration(..))
        | Some(StatementToken::ConstantDeclaration(..)) => {
            return Some(StatementToken::ExportDeclaration(Box::new(state.unwrap())));
        }
        _ => {
            pointer.error("invalid export".to_string());

            return None;
        }
    }
}
