import { NextResponse } from 'next/server';

// En un entorno real, esto vendría de una base de datos
// Aquí es solo un mock para demostración
const mockInspections = [
  {
    id: '123456-demo',
    createdAt: new Date().toISOString(),
    formData: {
      name: 'João Silva',
      email: 'joao.silva@example.com',
      phone: '(11) 98765-4321',
      licensePlate: 'ABC1234',
      mileage: '45000',
      modelYear: '2019',
      hasChassisNumber: 'sim',
      hasSecondKey: 'sim',
      acWorking: 'sim',
      hasWindshieldDamage: 'nao',
      hasLightsDamage: 'nao',
      hasTireDamage: 'sim',
      isOriginalSoundSystem: 'sim',
      conditions: ['nenhum'],
      safetyItems: ['chave', 'estepe', 'triangulo', 'macaco']
    },
    fileUrls: {
      crlvFile: `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/123456-demo/crlvFile.jpg`,
      tireDamagePhoto: `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/123456-demo/tireDamagePhoto.jpg`,
      videoFile: `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/123456-demo/videoFile.mp4`
    }
  }
];

export async function GET(request: Request) {
  try {
    // En un entorno real, aquí consultarías una base de datos
    
    // Para propósitos de demo, usamos datos mock
    return NextResponse.json({ 
      success: true, 
      inspections: mockInspections
    });
    
  } catch (error) {
    console.error('Error al obtener inspecciones:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao obter inspeções' 
    }, { status: 500 });
  }
}

// Endpoint para obtener una inspección específica por ID
export async function POST(request: Request) {
  try {
    const { inspectionId } = await request.json();
    
    if (!inspectionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de inspeção não fornecido' 
      }, { status: 400 });
    }
    
    // En un entorno real, buscarías en la base de datos
    const inspection = mockInspections.find(i => i.id === inspectionId);
    
    if (!inspection) {
      return NextResponse.json({ 
        success: false, 
        message: 'Inspeção não encontrada' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      inspection 
    });
    
  } catch (error) {
    console.error('Error al obtener la inspección:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao obter a inspeção' 
    }, { status: 500 });
  }
} 