package br.com.anestesiaflow.auth.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ReactForwardController {
	
	/**
     * Este método captura qualquer rota que não contenha um ponto (para ignorar .js, .css, .png)
     * e que não comece com /api (suas rotas de dados).
     * Ele "entrega" o index.html, e o React Router no navegador decide o que mostrar.
     */
    @GetMapping(value = {
        "/{path:[^\\.]*}", 
        "/view/**/{path:[^\\.]*}"
    })
    public String forward() {
        return "forward:/index.html";
    }

}
