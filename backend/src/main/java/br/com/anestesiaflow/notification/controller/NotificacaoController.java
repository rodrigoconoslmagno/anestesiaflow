package br.com.anestesiaflow.notification.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.anestesiaflow.notification.entidade.NotificacaoMensagem;
import br.com.anestesiaflow.notification.service.NotificacaoService;

@RestController
@RequestMapping("/notification")
public class NotificacaoController {

	@Autowired
	private NotificacaoService notificacaoService;
	
	@PostMapping("/add-device")
	public ResponseEntity<Void> registraDispositivo(@Validated @RequestBody String token){
		if (token != null && !token.isEmpty()) {
			notificacaoService.registraDispositivo(token);
		}
		return ResponseEntity.ok().build();
	}

	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).SUDOKU_NOTIFICAR) " +
			   "or @auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PLANTAO_NOTIFICAR)")
    @PostMapping("/send-notification")
    public ResponseEntity<Void> enviarGeral(@Validated @RequestBody NotificacaoMensagem msg) {
        notificacaoService.enviarNotificacao("Atualização de Escala", msg.getMensagem());
        return ResponseEntity.ok().build();
    }
}