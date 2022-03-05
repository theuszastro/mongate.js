use ansi_term::Color;

use crate::errors::syntax_error::ErrorLine;

pub struct Logger {
    filename: String,
}

impl Logger {
    pub fn new(filename: String) -> Self {
        Self { filename }
    }

    pub fn lines(&self, lines: Vec<ErrorLine>) {
        for line in lines {
            let block = self.block(self.yellow(format!("Line {}", line.line)));
            let code = self.white(line.lineContent.replace("\n", ""));

            println!("{} {}", block, code);
        }
    }

    pub fn error(&self, reason: String, line: usize) {
        let block = self.block(self.red("Error".to_string()));
        let msg = self.white(format!(
            "{} {} in {}",
            reason,
            self.red(format!("{}", self.filename)),
            self.yellow(format!("Line {}", line))
        ));

        println!("{} {}", block, msg);
    }

    pub fn info(&self, msg: String) {
        let block = self.block(self.cyan("Info".to_string()));
        let msg = self.white(msg);

        println!("{} {}", block, msg);
    }

    fn block(&self, msg: String) -> String {
        let open = Color::White.paint("[");
        let close = Color::White.paint("]");

        format!("{}{}{}", open, msg, close)
    }

    fn red(&self, msg: String) -> String {
        Color::Red.paint(msg).to_string()
    }

    fn white(&self, msg: String) -> String {
        Color::White.paint(msg).to_string()
    }

    fn yellow(&self, msg: String) -> String {
        Color::Yellow.paint(msg).to_string()
    }

    fn cyan(&self, msg: String) -> String {
        Color::Cyan.paint(msg).to_string()
    }
}
