use crate::tokenizer::Tokenizer;
use crate::utils::pointer::Pointer;

pub struct Compiler {
    pointer: Pointer,
    config: CompilerConfig,
}

#[derive(Clone)]
pub struct CompilerConfig {
    pub filename: String,
    pub content: String,
    pub json: bool,
}

impl Compiler {
    pub fn new(config: CompilerConfig) -> Self {
        let CompilerConfig {
            filename, content, ..
        } = config.clone();

        Self {
            config,
            pointer: Pointer::new(content, filename),
        }
    }

    pub fn run(&mut self) {
        let CompilerConfig {
            filename,
            content,
            json,
        } = &self.config;

        let mut tokenizer = Tokenizer::new(
            filename.clone(),
            content.clone(),
            json.clone(),
            self.pointer.clone(),
        );

        let tokens = tokenizer.run();
        for token in tokens {
            println!("{:?}", token);
        }
    }
}
