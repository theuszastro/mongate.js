#![allow(non_snake_case)]

mod compiler;
mod errors;
mod tokenizer;
mod utils;

use std::fs;

use crate::compiler::{Compiler, CompilerConfig};

fn main() {
    // let args: Vec<String> = std::env::args().collect();

    let content = fs::read_to_string("./data.nylock").unwrap();
    let mut compiler = Compiler::new(CompilerConfig {
        content,
        filename: "data.nylock".to_string(),
        json: false,
    });

    compiler.run();
}
