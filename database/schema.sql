-- Execute em um schema novo. O setup usa connectnet_entrega3 por padrão.
-- Este arquivo não contém DROP, TRUNCATE nem alteração do schema anterior.
CREATE TABLE IF NOT EXISTS plano (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  velocidade VARCHAR(50) NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  descricao VARCHAR(500) NOT NULL DEFAULT '',
  CONSTRAINT ck_plano_preco CHECK (preco > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cliente (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  data_cadastro DATE NOT NULL,
  status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  plano_id INT UNSIGNED NOT NULL,
  CONSTRAINT fk_cliente_plano FOREIGN KEY (plano_id) REFERENCES plano(id) ON DELETE RESTRICT,
  INDEX ix_cliente_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usuario (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('ADMIN','SUPORTE','CLIENTE') NOT NULL,
  cliente_id INT UNSIGNED NULL UNIQUE,
  CONSTRAINT fk_usuario_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE,
  CONSTRAINT ck_usuario_perfil CHECK ((perfil = 'CLIENTE' AND cliente_id IS NOT NULL) OR (perfil <> 'CLIENTE' AND cliente_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fatura (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  competencia CHAR(7) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  status ENUM('PENDENTE','PAGA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
  CONSTRAINT fk_fatura_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE RESTRICT,
  CONSTRAINT ck_fatura_valor CHECK (valor > 0),
  CONSTRAINT uq_fatura_competencia UNIQUE (cliente_id, competencia),
  INDEX ix_fatura_status_vencimento (status, data_vencimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chamado (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  descricao TEXT NOT NULL,
  data_abertura DATE NOT NULL,
  status ENUM('ABERTO','EM_ATENDIMENTO','RESOLVIDO') NOT NULL DEFAULT 'ABERTO',
  prioridade ENUM('BAIXA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
  CONSTRAINT fk_chamado_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE RESTRICT,
  INDEX ix_chamado_status_prioridade (status, prioridade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
