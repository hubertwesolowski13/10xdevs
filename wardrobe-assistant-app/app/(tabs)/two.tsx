import { Box } from '@/components/ui/box'
import { Card } from '@/components/ui/card'
import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'

export default function TabTwoScreen() {
  const handleGenerateCreation = () => {}

  return (
    <Box className="bg-primary-400">
      <Heading size="lg">Tab Two</Heading>
      <Card size="md" variant="elevated" className="m-3">
        <Button variant="solid" action="secondary" size="lg" onPress={handleGenerateCreation}>
          <ButtonText size="lg">Generate</ButtonText>
        </Button>
      </Card>
    </Box>
  )
}
