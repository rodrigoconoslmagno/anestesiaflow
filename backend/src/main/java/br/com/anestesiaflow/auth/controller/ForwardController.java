package br.com.anestesiaflow.auth.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ForwardController {
	
	@RequestMapping(value = "{path:[^\\.]*}")
    public String redirect() {
        // Redireciona internamente para o index.html do React
        return "forward:/";
    }

}
