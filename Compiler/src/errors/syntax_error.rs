use crate::tokenizer::Token;
use crate::utils::logger::Logger;

#[derive(Debug)]
pub struct ErrorLine {
    pub line: usize,
    pub lineContent: String,
}

pub struct SyntaxError {}
pub struct SyntaxErrorConfig {
    pub line: usize,
    pub lines: Vec<Vec<String>>,
    pub json: bool,
    pub filename: String,
    pub tokens: Vec<Token>,
}

impl SyntaxErrorConfig {
    pub fn new(
        filename: String,
        lines: Vec<Vec<String>>,
        json: bool,
        line: usize,
        tokens: Vec<Token>,
    ) -> Self {
        Self {
            filename,
            lines,
            json,
            line,
            tokens,
        }
    }
}

impl SyntaxError {
    fn getLine(lines: Vec<Vec<String>>, position: usize) -> String {
        let currentLine = lines.get(position);

        if let Some(content) = currentLine {
            return content.join("");
        }

        "".to_string()
    }

    fn getLines(line: usize, lines: Vec<Vec<String>>) -> Vec<ErrorLine> {
        let mut errorLines: Vec<ErrorLine> = Vec::new();

        if line - 1 > 0 {
            for i in [5, 4, 3, 2, 1] {
                if line - 1 - i > 0 {
                    errorLines.push(ErrorLine {
                        line: line - i,
                        lineContent: SyntaxError::getLine(lines.clone(), line - 1 - i),
                    })
                }
            }
        }

        errorLines.push(ErrorLine {
            line,
            lineContent: SyntaxError::getLine(lines.clone(), line - 1),
        });

        for i in [1, 2, 3, 4, 5] {
            let lineContent = SyntaxError::getLine(lines.clone(), line - 1 + i);

            if lineContent != "" {
                errorLines.push(ErrorLine {
                    line: line + i,
                    lineContent,
                });
            }
        }

        return errorLines;
    }

    pub fn new(config: SyntaxErrorConfig) {
        let lines = SyntaxError::getLines(config.line, config.lines);
        let logger = Logger::new(config.filename);

        logger.error("SyntaxError on".to_string(), config.line);
        logger.lines(lines);
        logger.info("Unexpected '='".to_string());
    }
}
