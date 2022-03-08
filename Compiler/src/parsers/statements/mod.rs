use std::mem::ManuallyDrop;

use crate::utils::pointer::Pointer;

use super::StatementToken;

mod variable;

pub fn statements(
    pointer: &mut ManuallyDrop<Pointer>,
    names: &mut Vec<String>,
    keyword: String,
) -> Option<StatementToken> {
    pointer.take("Keyword", true, true, true);

    match keyword.as_str() {
        "let" | "const" => variable::variable(pointer, names, keyword == "const"),
        _ => None,
    }
}
