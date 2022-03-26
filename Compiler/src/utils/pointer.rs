use crate::errors::SyntaxError;
use crate::tokenizer::Tokenizer;

use super::{ParsedToken, Token};

#[derive(Debug, Clone)]
pub struct ImportedModule {
    pub name: String,
    pub body: Vec<ParsedToken>,
}

#[derive(Debug, Clone)]
pub struct Pointer {
    pub tokenizer: Tokenizer,
    pub token: Option<Token>,
    pub globalFunctions: Vec<String>,
    pub imports: Vec<ImportedModule>,
}

impl Pointer {
    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            token: None,
            tokenizer,
            imports: vec![],
            globalFunctions: vec![
                "log".to_string(),
                "warn".to_string(),
                "error".to_string(),
                "info".to_string(),
                "require".to_string(),
            ],
        }
    }

    pub fn memorize(&mut self) -> (String, usize, usize) {
        return self.tokenizer.memorize();
    }

    pub fn restore(&mut self, data: (String, usize, usize)) {
        self.tokenizer.restore(data);
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

    pub fn previewNext(&mut self, skipNewline: bool, skipWhitespace: bool) -> Option<Token> {
        return self.tokenizer.previewNextToken(skipNewline, skipWhitespace);
    }

    pub fn take(&mut self, r#type: &str, skipNewline: bool, skipWhitespace: bool) -> Option<Token> {
        if let Some(token) = self.token.clone() {
            if token.tokenType() == r#type.to_string() {
                self.next(skipNewline, skipWhitespace);

                return Some(token);
            }
        }

        None
    }

    pub fn next(&mut self, skipNewline: bool, skipWhitespace: bool) -> Option<Token> {
        match self.tokenizer.getToken() {
            None | Some(Token::EOF) => {
                self.token = None;

                None
            }
            Some(Token::Newline(_)) if skipNewline => {
                return self.next(skipNewline, skipWhitespace)
            }
            Some(Token::Whitespace(_)) if skipWhitespace => {
                return self.next(skipNewline, skipWhitespace)
            }
            Some(Token::Identifier(data, _)) if data.len() <= 0 => None,
            data => {
                self.token = data.clone();

                return data;
            }
        }
    }
}
