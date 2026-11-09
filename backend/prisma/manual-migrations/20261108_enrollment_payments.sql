ALTER TABLE matriculas
  ADD COLUMN monto_total DECIMAL(10, 2) NULL AFTER monto_pagado;

UPDATE matriculas AS m
INNER JOIN cursos AS c ON c.id = m.curso_id
SET m.monto_total = c.precio
WHERE m.monto_total IS NULL;

CREATE TABLE matricula_pagos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  matricula_id BIGINT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  metodo VARCHAR(30) NOT NULL,
  referencia VARCHAR(100) NULL,
  nota VARCHAR(500) NULL,
  pagado_at DATETIME NOT NULL,
  registrado_por BIGINT NULL,
  legacy_matricula_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY matricula_pagos_legacy_matricula_unique (legacy_matricula_id),
  KEY matricula_pagos_matricula_id_pagado_at_index (matricula_id, pagado_at),
  CONSTRAINT matricula_pagos_matricula_id_foreign
    FOREIGN KEY (matricula_id) REFERENCES matriculas (id)
    ON DELETE RESTRICT ON UPDATE NO ACTION
) ENGINE=InnoDB;

INSERT INTO matricula_pagos (
  matricula_id,
  monto,
  metodo,
  nota,
  pagado_at,
  legacy_matricula_id,
  created_at
)
SELECT
  m.id,
  m.monto_pagado,
  'historico',
  'Importado de monto_pagado; la fecha real del pago no estaba disponible.',
  TIMESTAMP(m.fecha_matricula),
  m.id,
  CURRENT_TIMESTAMP
FROM matriculas AS m
WHERE m.monto_pagado IS NOT NULL
  AND m.monto_pagado > 0;
