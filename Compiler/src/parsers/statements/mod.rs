use std::mem::ManuallyDrop;

use crate::parsers::{Expression, ParsedToken};
use crate::utils::pointer::Pointer;

mod block;
mod function;
mod variable;

pub use block::readBlock;

#[derive(Debug, Clone)]
pub enum StatementToken {
    VariableDeclaration(String, Expression),
    ConstantDeclaration(String, Expression),
    FunctionDeclaration(String, Vec<Expression>, Vec<ParsedToken>, bool),
}

pub fn statements(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut Vec<ParsedToken>,
    keyword: String,
) -> Option<StatementToken> {
    pointer.take("Keyword", true, true);

    match keyword.as_str() {
        "let" | "const" => variable::variable(pointer, body, keyword == "const"),
        "def" | "async" => function::function(pointer, body, keyword == "async"),
        _ => None,
    }
}
