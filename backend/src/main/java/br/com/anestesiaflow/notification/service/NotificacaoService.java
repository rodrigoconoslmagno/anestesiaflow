package br.com.anestesiaflow.notification.service;

import java.util.List;
import org.springframework.stereotype.Service;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;

import br.com.anestesiaflow.notification.entidade.NotificacaoDispositivo;
import br.com.anestesiaflow.notification.entidade.NotificacaoMensagem;
import br.com.anestesiaflow.notification.repository.NotificacaoDispositivoRepository;
import br.com.anestesiaflow.notification.repository.NotificacaoMensagemRepository;

@Service
public class NotificacaoService {

	private final NotificacaoDispositivoRepository repositoryDispositivo;
	private final NotificacaoMensagemRepository repositoryMensagem;
	
	public NotificacaoService(NotificacaoDispositivoRepository repositoryDispositivo, 
							  NotificacaoMensagemRepository repositoryMensagem) {
		this.repositoryDispositivo = repositoryDispositivo;
		this.repositoryMensagem = repositoryMensagem;
	}
	
	public void registraDispositivo(String token) {
		if (!repositoryDispositivo.existsByToken(token)) {
			NotificacaoDispositivo dispositivo = new NotificacaoDispositivo();
			dispositivo.setToken(token);
			repositoryDispositivo.save(dispositivo);
		}
	}
	
	
	public void registraMensagem(String mensagem) {
		NotificacaoMensagem msg = new NotificacaoMensagem();
		msg.setMensagem(mensagem);
		repositoryMensagem.save(msg);
	}
	
	public void enviarNotificacao(String titulo, String corpo) {
        List<String> tokens = repositoryDispositivo.findAllTokens();

        if (tokens.isEmpty()) {
            System.out.println("Nenhum dispositivo registrado para receber notificações.");
            return;
        }

        MulticastMessage message = MulticastMessage.builder()
                .setNotification(Notification.builder()
                        .setTitle(titulo)
                        .setBody(corpo)
                        .build())
                .addAllTokens(tokens)
                .build();

        try {
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            System.out.println("Sucesso: " + response.getSuccessCount() + " notificações enviadas.");
            
            if (response.getFailureCount() > 0) {
                System.out.println("Falhas: " + response.getFailureCount());
                String msgErro = "";
                for(SendResponse erro : response.getResponses()) {
                  	if (erro.getException() != null) {
                  		msgErro += erro.getException().getMessage();
                  	}
                }
                System.out.println("Detalhe Falhas: " + msgErro);
            }
        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }
}
