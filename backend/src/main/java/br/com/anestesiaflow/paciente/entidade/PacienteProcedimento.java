package br.com.anestesiaflow.paciente.entidade;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonBackReference;

import br.com.anestesiaflow.estabelecimento.model.Estabelecimento;
import br.com.anestesiaflow.framework.persistence.BaseEntity;
import br.com.anestesiaflow.medico.model.Medico;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pacienteprocedimento")
public class PacienteProcedimento extends BaseEntity<Integer>{

	private static final long serialVersionUID = -2747227390638791449L;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pacienteid", nullable = false)
    @JsonBackReference
    private Paciente paciente;
	@Column(name = "dataprocedimento")
	private LocalDate dataProcedimento;
	@Column
	private String procedimento;

	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cirurgiaoid")
	private Medico cirurgiao;
	
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicoid")
	private Medico medico;
	
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estabelecimentoid")
	private Estabelecimento estabelecimento;

	@Column
	private boolean pago;
	@Column(name="valorprevisto", precision=2)
	private double valorPrevisto;
	@Column(name="valorefetivo", precision=2)
	private double valorEfetivo;
	
	public Paciente getPaciente() {
		return paciente;
	}
	
	public void setPaciente(Paciente paciente) {
		this.paciente = paciente;
	}
	
	public LocalDate getDataProcedimento() {
		return dataProcedimento;
	}
	
	public void setDataProcedimento(LocalDate dataProcedimento) {
		this.dataProcedimento = dataProcedimento;
	}
	
	public String getProcedimento() {
		return procedimento;
	}
	
	public void setProcedimento(String procedimento) {
		this.procedimento = procedimento;
	}
	
	public Medico getCirurgiao() {
		return cirurgiao;
	}
	
	public void setCirurgiao(Medico cirurgiao) {
		this.cirurgiao = cirurgiao;
	}
	
	public Medico getMedico() {
		return medico;
	}
	
	public void setMedico(Medico medico) {
		this.medico = medico;
	}
	
	public Estabelecimento getEstabelecimento() {
		return estabelecimento;
	}
	
	public void setEstabelecimento(Estabelecimento estabelecimento) {
		this.estabelecimento = estabelecimento;
	}

    public boolean isPago() {
        return pago;
    }

    public void setPago(boolean pago) {
        this.pago = pago;
    }

    public double getValorEfetivo() {
        return valorEfetivo;
    }

    public void setValorEfetivo(double valorEfetivo) {
        this.valorEfetivo = valorEfetivo;
    }

    public double getValorPrevisto() {
        return valorPrevisto;
    }

    public void setValorPrevisto(double valorPrevisto) {
        this.valorPrevisto = valorPrevisto;
    }
}