pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

#[cfg(test)]
pub(crate) mod test {
    macro_rules! log {
        ( $( $t:tt )* ) => {
            web_sys::console::log_1(&format!( $( $t )* ).into());
        }
    }
    pub(crate) use log;
}
