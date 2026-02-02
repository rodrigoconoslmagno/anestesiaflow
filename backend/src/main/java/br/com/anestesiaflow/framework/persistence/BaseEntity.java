package br.com.anestesiaflow.framework.persistence;

import java.io.Serializable;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.persistence.*;

@MappedSuperclass
public abstract class BaseEntity<ID extends Serializable> implements Serializable {

    private static final long serialVersionUID = 4036764450552918032L;
    private static final String SEPARATOR = ",";
    private static final String FROM_CODIGO_METHOD_NAME = "fromCodigo";

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false, nullable = false)
	protected ID id;
    
    @Column(name = "datacriacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;
    
    @Column(name = "dataatualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    protected void onCreate() {
        this.dataCriacao = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }
    
    public ID getId() {
		return id;
	}
    
    public void setId(ID id) {
		this.id = id;
	}
	
    public LocalDateTime getDataCriacao() {
		return dataCriacao;
	}
    
    public LocalDateTime getDataAtualizacao() {
		return dataAtualizacao;
	}
    
    /**
     * Auxilia a converter uma lista de BaseEnums para a String de códigos do DB.
     */
    protected <E extends BaseEnum> String convertListEnumToString(List<E> enums) {
        if (enums == null || enums.isEmpty()) {
            return null;
        }
        return enums.stream()
                .map(BaseEnum::getCodigo)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }
    
    /**
     * Converte um código string individual para a constante Enum correspondente usando Reflexão.
     */
    private static <E extends Enum<E> & BaseEnum> E convertCodeToEnum(String codeStr, Class<E> enumClass) {
        try {
            int code = Integer.parseInt(codeStr);
            
            // 1. Obtém o método estático 'fromCodigo(int)' do Enum específico
            Method fromCodeMethod = enumClass.getMethod(FROM_CODIGO_METHOD_NAME, int.class);
            
            // 2. Invoca o método estático (primeiro argumento 'null')
            @SuppressWarnings("unchecked")
            E result = (E) fromCodeMethod.invoke(null, code);
            
            return result;
            
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException(
                "O Enum " + enumClass.getSimpleName() + 
                " deve implementar o método estático public static <Enum> fromCodigo(int) com o retorno do próprio Enum.", e);
        } catch (NumberFormatException e) {
            System.err.println("Código não numérico encontrado no DB para " + enumClass.getSimpleName() + ": " + codeStr);
            return null;
        } catch (Exception e) {
             throw new RuntimeException("Erro ao converter código '" + codeStr + "' para Enum " + enumClass.getSimpleName(), e);
        }
    }
    
    /**
     * Converte uma string de códigos separados por vírgula para uma lista de Enums.
     * Chamado tipicamente no Getter da Entidade após o carregamento do DB.
     * @param <E> O tipo do Enum (deve implementar BaseEnum e ter o método estático fromCodigo(int)).
     * @param dbData A string lida do banco de dados (ex: "1,3,5").
     * @param enumClass A classe do Enum concreto (ex: ParticipanteTipo.class).
     * @return Uma lista de Enums do tipo E.
     */
    protected <E extends Enum<E> & BaseEnum> List<E> convertStringToListEnum(String dbData, Class<E> enumClass) {
        
        if (dbData == null || dbData.trim().isEmpty()) {
            return List.of();
        }

        return Arrays.stream(dbData.split(SEPARATOR))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(codeStr -> convertCodeToEnum(codeStr, enumClass))
                .filter(item -> item != null)
                .collect(Collectors.toList());
    }
}