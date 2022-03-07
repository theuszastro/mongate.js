use crate::errors::SyntaxError;
use crate::tokenizer::{Token, Tokenizer};

#[derive(Debug, Clone)]
pub struct Pointer {
    pub tokenizer: Tokenizer,
    pub token: Option<Token>,
}

impl Pointer {
    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            token: None,
            tokenizer,
        }
    }

    pub fn error(&mut self, reason: String) {
        let Tokenizer {
            filename,
            lines,
            line,
            ..
        } = &self.tokenizer;

        SyntaxError::new(filename.clone(), lines.clone(), *line, reason);
    }

    pub fn previewNext(
        &mut self,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        return self
            .tokenizer
            .previewNextToken(skipNewline, skipSemicolon, skipWhitespace);
    }

    pub fn take(
        &mut self,
        r#type: &str,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        if let Some(token) = self.token.clone() {
            if token.tokenType() == r#type.to_string() {
                self.next(skipNewline, skipSemicolon, skipWhitespace);

                return Some(token);
            }
        }

        None
    }

    pub fn next(
        &mut self,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        match self.tokenizer.getToken() {
            None | Some(Token::EOF) => {
                self.token = None;

                None
            }
            Some(Token::Newline(_)) if skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Whitespace(_)) if skipWhitespace => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Punctuation(data, _)) if data == ";" && skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Identifier(data, _)) if data.len() <= 0 => None,
            data => {
                self.token = data.clone();

                return data;
            }
        }
    }
}
