package br.com.anestesiaflow.auth.permission;

import java.util.Map;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum Permissoes {
	
	USUARIO_ACESSAR("Cadastro", "Usuário", "ACESSAR", "pi pi-user", true, "/usuario"),
	USUARIO_NOVO("Cadastro", "Novo", "NOVO", "pi pi-plus", false, null),
	USUARIO_ALTERAR("Cadastro", "Alterar", "ALTERAR", "pi pi-pencil", false, null),
	USUARIO_EXCLUIR("Cadastro", "Excluir", "EXCLUIR", "pi pi-trash", false, null),
	
	MEDICO_ACESSAR("Cadastro", "Médico", "ACESSAR", "pi pi-users", true, "/medico"),
    MEDICO_NOVO("Cadastro", "Novo", "NOVO", "pi pi-plus", false, null),
    MEDICO_ALTERAR("Cadastro", "Alterar", "ALTERAR", "pi pi-pencil", false, null),
    MEDICO_EXCLUIR("Cadastro", "Excluir", "EXCLUIR", "pi pi-trash", false, null),
    
	ESTABELECIMENTO_ACESSAR("Cadastro", "Clinica/Hospitais", "ACESSAR", "pi pi-building", true, "/estabelecimento"),
	ESTABELECIMENTO_NOVO("Cadastro", "Novo", "NOVO", "pi pi-plus", false, null),
	ESTABELECIMENTO_ALTERAR("Cadastro", "Alterar", "ALTERAR", "pi pi-pencil", false, null),
	ESTABELECIMENTO_EXCLUIR("Cadastro", "Excluir", "EXCLUIR", "pi pi-trash", false, null),
	
	ESCALA_ACESSAR("Escala", "Escala", "ACESSAR", "pi pi-calendar", true, "/escala"),
	ESCALA_NOVO("Escala", "Novo", "NOVO", "pi pi-plus", false, null),
	ESCALA_ALTERAR("Escala", "Alterar", "ALTERAR", "pi pi-pencil", false, null),
	ESCALA_EXCLUIR("Escala", "Excluir", "EXCLUIR", "pi pi-trash", false, null),
	
	ESCALASEMANAL_ACESSAR("Escala", "Escala Semanal", "ACESSAR", "pi pi-calendar-plus", true, "/escalamedicoview"),
	
	SUDOKU_ACESSAR("Sudoku", "Sudoku", "ACESSAR", "pi pi-th-large", true, "/sudokuview"),
	SUDOKU_ALTERAR("Sudoku", "Alterar / Escluir", "ALTERAR", "pi pi-pencil", false, null),
	SUDOKU_ARQUIVAR("Sudoku", "Arquivar", "ARQUIVAR", "pi pi-box", false, null),
	SUDOKU_NOTIFICAR("Sudoku", "Notificar", "NOTIFICAR", "pi pi-send", false, null),
	
	SUDOKURESUMO_ACESSAR("Sudoku", "Sudoku Resumo", "ACESSAR", "pi pi-chart-bar", true, "/sudokuresumoview"),
	
	SIMETRIA_ACESSAR("Sudoku", "Simetria", "ACESSAR", "pi pi-clone", true, "/simetriaview"),
	SIMETRIA_ALTERAR("Sudoku", "Alterar", "ALTERAR", "pi pi-pencil", false, null)

    ;
	
	private final String modulo;
    private final String descricao;   
    private final String acao;   
    private final String icone;
    private final boolean exibirNoMenu;
    private final String rota;

    private Permissoes(String modulo, String descricao, String acao, 
    					String icone, boolean exibirNoMenu, String rota) {
    	this.modulo = modulo;
        this.descricao = descricao;
        this.acao = acao;
        this.icone = icone;
        this.exibirNoMenu = exibirNoMenu;
        this.rota = rota;
    }
    
    @JsonCreator
    public static Permissoes fromObject(Map<String, Object> obj) {
        if (obj != null && obj.containsKey("id")) {
            return Permissoes.valueOf((String) obj.get("id"));
        }
        return null;
    }

    // Garante que o ID (nome do Enum) seja enviado ao Front
    @JsonProperty("id")
    public String getId() {
        return this.name();
    }

    public String getModulo() {
		return modulo;
	}
    
    public String getDescricao() {
		return descricao;
	}
    
    public String getAcao() {
		return acao;
	}
    
    public String getIcone() {
		return icone;
	}
    
    public boolean isExibirNoMenu() {
		return exibirNoMenu;
	}
    
    public String getRota() {
		return rota;
	}
}