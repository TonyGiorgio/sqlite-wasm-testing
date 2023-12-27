#![crate_name = "my_rust_crate"]
// wasm is considered "extra_unused_type_parameters"
#![allow(
    incomplete_features,
    clippy::extra_unused_type_parameters,
    clippy::arc_with_non_send_sync
)]

extern crate core;

mod utils;

use log::Level;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/internal.js")]
extern "C" {
    pub fn name() -> String;

    pub type MyClass;

    #[wasm_bindgen(constructor)]
    pub fn new() -> MyClass;

    #[wasm_bindgen(method, getter)]
    pub fn number(this: &MyClass) -> u32;
    #[wasm_bindgen(method, setter)]
    pub fn set_number(this: &MyClass, number: u32) -> MyClass;
    #[wasm_bindgen(method)]
    pub fn render(this: &MyClass) -> String;
}

#[wasm_bindgen(module = "/is-odd.js")]
extern "C" {
    #[wasm_bindgen(js_name = "isOdd")]
    pub fn isOdd(num: u32) -> bool;
}

#[wasm_bindgen(module = "/sqlocal.js")]
extern "C" {
    pub type SQLocal;

    #[wasm_bindgen(constructor)]
    pub fn new(path: String) -> SQLocal;

    #[wasm_bindgen(method, variadic)]
    pub async fn sql(
        this: &SQLocal,
        query_template: js_sys::Array,
        params: js_sys::Array,
    ) -> JsValue;
}

#[wasm_bindgen(module = "/processor.js")]
extern "C" {
    pub type SQLocalProcessor;

    #[wasm_bindgen(constructor)]
    pub fn new() -> SQLocalProcessor;
}

// lifted from the `console_log` example
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// #[wasm_bindgen(start)]
fn run() {
    wasm_logger::init(wasm_logger::Config::new(Level::Debug).message_on_new_line());
    utils::set_panic_hook();

    /*
    log(&format!("Hello from {}!", name())); // should output "Hello from Rust!"

    let x = MyClass::new();
    assert_eq!(x.number(), 42);
    x.set_number(10);
    log(&x.render());
    */
}

#[cfg(test)]
mod tests {
    use crate::{
        isOdd,
        utils::{self, test::*},
        MyClass, SQLocal,
    };

    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::{wasm_bindgen_test as test, wasm_bindgen_test_configure};

    wasm_bindgen_test_configure!(run_in_browser);

    #[test]
    async fn test_internal() {
        log!("creating new class");

        let x = MyClass::new();
        assert_eq!(x.number(), 42);
        x.set_number(10);
        log!("{}", &x.render());
    }

    #[test]
    async fn test_is_odd() {
        log!("testing is odd");
        assert!(!isOdd(20));
        assert!(isOdd(21));
    }

    #[test]
    async fn init_sqlocal() {
        utils::set_panic_hook();

        let x = SQLocal::new("test".to_string());
        let stmt = &JsValue::from_str(
            "CREATE TABLE groceries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)",
        );
        let query = js_sys::Array::new();
        query.push(stmt);
        let q = x.sql(query, js_sys::Array::new()).await;
    }
}
