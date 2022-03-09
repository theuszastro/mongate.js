use std::mem::ManuallyDrop;

use crate::utils::{HoistingBlock, Pointer, StatementToken};

mod block;
mod function;
mod variable;

pub use block::readBlock;

pub fn statements(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
    keyword: String,
) -> Option<StatementToken> {
    pointer.take("Keyword", true, true);

    match keyword.as_str() {
        "let" | "const" => variable::variable(pointer, body, keyword == "const"),
        "fn" | "async" => function::function(pointer, body, keyword == "async"),
        _ => None,
    }
}
