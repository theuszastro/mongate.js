use crate::tokenizer::TokenContext;

#[derive(Debug, Clone)]
pub struct Pointer {
    cursor: usize,

    content: String,
    filename: String,

    pub line: i64,
    pub letter: String,
}

impl Pointer {
    fn _getLine(&self) -> String {
        let lines = self
            .content
            .split("\n")
            .map(|x| x.to_string())
            .collect::<Vec<String>>();

        let lineContent = lines.get((self.line - 1) as usize).unwrap();

        return lineContent.to_string();
    }

    pub fn context(&self) -> TokenContext {
        TokenContext {
            filename: self.filename.clone(),
            line: self.line,
            lineContent: self._getLine(),
        }
    }

    pub fn new(content: String, filename: String) -> Self {
        Self {
            cursor: 1,
            line: 1,
            letter: content
                .split("")
                .map(|x| x.to_string())
                .collect::<Vec<String>>()
                .get(1 as usize)
                .unwrap_or(&"EndFile".to_string())
                .to_string(),
            content,
            filename,
        }
    }

    pub fn newline(&mut self) {
        self.line += 1;
    }

    pub fn next(&mut self) {
        self.cursor += 1;
        self.letter = self
            .content
            .split("")
            .map(|x| x.to_string())
            .collect::<Vec<String>>()
            .get(self.cursor as usize)
            .unwrap_or(&"EndFile".to_string())
            .to_string()
    }
}
