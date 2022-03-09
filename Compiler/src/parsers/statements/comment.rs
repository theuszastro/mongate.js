use crate::utils::{Pointer, StatementToken, Token};
use std::mem::ManuallyDrop;

pub fn comment(pointer: &mut ManuallyDrop<Pointer>) -> Option<StatementToken> {
    let mut content = String::new();

    loop {
        match pointer.token.clone() {
            Some(Token::Newline(_)) => {
                pointer.take("Newline", true, true);

                break;
            }
            Some(token) => {
                content.push_str(&token.tokenValue());

                pointer.next(false, false);
            }
            None => break,
        }
    }

    Some(StatementToken::CommentDeclaration(content))
}
