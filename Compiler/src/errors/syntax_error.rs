use std::process;

use serde_derive::Serialize;
use serde_json::to_string;

#[derive(Debug, Serialize)]
pub struct ErrorLine {
    pub line: usize,
    pub lineContent: String,
}

#[derive(Serialize)]
pub struct SyntaxError {
    r#type: String,
    reason: String,
    filename: String,
    lineNumber: usize,
    lineError: String,
    lines: Vec<ErrorLine>,
}

impl SyntaxError {
    pub fn new(filename: String, lines: Vec<Vec<String>>, line: usize, reason: String) {
        let err = SyntaxError {
            r#type: "SyntaxError".to_string(),
            reason,
            filename,
            lineNumber: line,
            lineError: SyntaxError::getLine(lines.clone(), (line - 1) as usize),
            lines: SyntaxError::getLines(lines.clone(), line as i64 - 1),
        };

        println!("{}", to_string(&err).unwrap());

        process::exit(1);
    }

    fn getLine(lines: Vec<Vec<String>>, position: usize) -> String {
        let currentLine = lines.get(position);

        if let Some(content) = currentLine {
            return content.join("");
        }

        "".to_string()
    }

    fn getLines(lines: Vec<Vec<String>>, line: i64) -> Vec<ErrorLine> {
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
}
