use std::mem::ManuallyDrop;

use crate::utils::pointer::Pointer;

use super::StatementToken;

mod variable;

pub fn statements(pointer: &mut ManuallyDrop<Pointer>, keyword: String) -> Option<StatementToken> {
    pointer.take("Keyword", true, true, true);

    match keyword.as_str() {
        "let" | "const" => variable::variable(pointer, keyword == "const"),
        _ => None,
    }
}
