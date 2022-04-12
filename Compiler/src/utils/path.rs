use std::mem::ManuallyDrop;
use std::path::PathBuf;

use regex::Regex;

use crate::utils::Pointer;

pub fn isLibrary(path: String) -> bool {
    return !(path.starts_with("./") | path.starts_with("../"));
}

pub fn getPath(pointer: &mut ManuallyDrop<Pointer>, filePath: String) -> String {
    let regex = Regex::new(r"^\.{1,2}/(.+)").unwrap();
    let last = Regex::new(r"^(.+)/$").unwrap();

    let path = regex.replace(filePath.as_str(), "$1").to_string();

    let folderEmpty = format!("{}/{}", pointer.executable, path);
    let folderNotEmpty = format!("{}/{}/{}", pointer.executable, pointer.folder, path);

    let path = if pointer.folder.is_empty() {
        folderEmpty.clone()
    } else {
        folderNotEmpty.clone()
    };

    if PathBuf::from(path.clone()).is_dir() {
        return getPath(
            pointer,
            format!("{}/index", last.replace(&filePath, "$1").to_string()),
        );
    }

    return format!("{}.nylock", path);
}
