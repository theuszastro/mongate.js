use std::process;

use serde_derive::Serialize;
use serde_json::to_string;

use crate::utils::logger::Logger;

#[derive(Debug)]
pub struct ErrorLine {
    pub line: usize,
    pub lineContent: String,
}

#[derive(Serialize)]
struct SyntaxErrorJson {
    reason: String,
    line: i64,
    lineContent: String,
}

pub struct SyntaxError {}
pub struct SyntaxErrorConfig {
    pub line: usize,
    pub lines: Vec<Vec<String>>,
    pub json: bool,
    pub filename: String,
    pub reason: String,
}

impl SyntaxErrorConfig {
    pub fn new(
        filename: String,
        lines: Vec<Vec<String>>,
        json: bool,
        line: usize,
        reason: String,
    ) -> Self {
        Self {
            filename,
            lines,
            json,
            line,
            reason,
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

    fn getLines(line: i64, lines: Vec<Vec<String>>) -> Vec<ErrorLine> {
        let mut errorLines: Vec<ErrorLine> = Vec::new();

        if line - 1 > 0 {
            for i in [5, 4, 3, 2, 1] {
                if line - 1 - i > 0 {
                    errorLines.push(ErrorLine {
                        line: (line - i) as usize,
                        lineContent: SyntaxError::getLine(lines.clone(), (line - 1 - i) as usize),
                    })
                }
            }
        }

        errorLines.push(ErrorLine {
            line: line as usize,
            lineContent: SyntaxError::getLine(lines.clone(), (line - 1) as usize),
        });

        for i in [1, 2, 3, 4, 5] {
            let lineContent = SyntaxError::getLine(lines.clone(), (line - 1 + i) as usize);

            if lineContent != "" {
                errorLines.push(ErrorLine {
                    line: (line + i) as usize,
                    lineContent,
                });
            }
        }

        return errorLines;
    }

    pub fn new(config: SyntaxErrorConfig) {
        let SyntaxErrorConfig {
            line,
            lines,
            filename,
            reason,
            json,
        } = config;

        if json {
            let errLine = SyntaxError::getLine(lines, line);

            let err = SyntaxErrorJson {
                reason,
                line: line as i64,
                lineContent: errLine,
            };

            println!("{}", to_string(&err).unwrap());
        } else {
            let errLines = SyntaxError::getLines(line as i64, lines);
            let logger = Logger::new(filename);
            logger.error("SyntaxError on".to_string(), line);
            logger.lines(errLines);
            logger.info(reason);
        }

        process::exit(1);
    }
}
