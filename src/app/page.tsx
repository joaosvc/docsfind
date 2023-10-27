'use client'

import { useRef, useState } from 'react'
import Header from './components/header'
import './globals.css'

type Person = {
  CPF: string
  Name: string
  Phone: string
}

type PeopleDataEditing = {
  currentPerson: Person | undefined
  page: number
  maxPage: number
  amount: {
    Correct: number
    Invalid: number
  }
  data: Record<string, Person>
}

export default function Home() {
  const [isEditingData, setIsEditingData] = useState(false)
  const [editingData, setEditingData] = useState(false)
  const [finalizingData, setFinalizingData] = useState(false)
  const [copyState, setCopyState] = useState<Record<any, boolean>>({
    CPF: false,
    Name: false,
    Phone: false
  })
  const [PeopleDataEditing, setPeopleDataEditing] = useState<PeopleDataEditing>({
    currentPerson: undefined,
    page: 0,
    maxPage: 0,
    amount: {
      Correct: 0,
      Invalid: 0
    },
    data: {}
  })
  const TextAreaRef = useRef<HTMLTextAreaElement>(null)
  const NewPhoneInputRef = useRef<HTMLInputElement>(null)

  /** This is a work around */
  const copyStateScheduler = setInterval(() => {
    clearCopyState()
  }, 1000 * 40)

  const clearCopyState = () => {
    for (let key in copyState) {
      if (copyState[key]) {
        handleCopyState(key, false)
      }
    }
    clearInterval(copyStateScheduler)
  }

  const handleCopyState = (type: any, value: Boolean) => {
    setCopyState((prevState) => ({ ...prevState, [type]: value }))
  }

  const handlePeopleDataEditing = (type: any, value: any) => {
    setPeopleDataEditing((prevState) => ({ ...prevState, [type]: value }))
  }

  const ConvertStringDataToObject = (data: string) => {
    return data
      .split('\n')
      .map((line) => {
        const [key, value] = line.split(': ')
        const trimmedKey = String(key).trim()
        const trimmedValue = String(value).trim()

        if (trimmedKey && trimmedValue) {
          return { [trimmedKey]: trimmedValue }
        }
        return null
      })
      .filter((obj) => obj !== null)
      .reduce((acc, obj) => ({ ...acc, ...obj }), {})
  }

  const ExtractPersonName = (NameInfo: string) => {
    const name = NameInfo.split(' ')

    if (name.length >= 2) {
      const firstName = name[0]
      let secondName = name[1]

      if (secondName.length <= 3 && name[2]) {
        secondName = name[2]
      }

      return `${firstName} ${secondName}`
    }
    return name
  }

  const ProcessSimplePersonInfo = (PersonInfo: Person) => {
    const { CPF, Name, Phone } = PersonInfo

    return {
      CPF: CPF.replace(/\.|-/gm, ''),
      Name: ExtractPersonName(Name),
      Phone: Phone.split(' ')[0].replace(/[^\d]/g, '')
    }
  }

  const ExtractDataFromPeople = (content: string) => {
    const DataLines = content.split(/(?=CPF:)/g)

    return DataLines.map((line) => {
      const PersonInfo = ConvertStringDataToObject(line)

      return ProcessSimplePersonInfo({
        CPF: String(PersonInfo?.CPF),
        Name: String(PersonInfo?.Nome),
        Phone: String(PersonInfo?.Telefone)
      })
    }) as Person[]
  }

  const ProcessorHandler = () => {
    const textareaContent = TextAreaRef.current?.value || ''
    const peopleData: Person[] = ExtractDataFromPeople(textareaContent)

    const CorrectPhoneNumbers: Record<string, Person> = {}
    const InvalidPhoneNumbers: Record<string, Person> = {}

    const CPFUsed: string[] = []

    for (let key in peopleData) {
      const PersonData = peopleData[key]
      const CPF = peopleData[key]?.CPF ?? null
      const Phone = PersonData?.Phone ?? null

      if (!CPF || CPF.length !== 11 || CPFUsed.includes(CPF)) {
        continue
      }
      CPFUsed.push(PersonData?.CPF)

      if (Phone && (Phone.startsWith('85') || Phone.length < 1)) {
        CorrectPhoneNumbers[key] = PersonData
      } else {
        InvalidPhoneNumbers[key] = PersonData
      }
    }

    localStorage.setItem('PeopleContent', textareaContent)
    localStorage.setItem('PeopleData', JSON.stringify(peopleData))
    localStorage.setItem(
      'PeopleNumbers',
      JSON.stringify({ Correct: CorrectPhoneNumbers, Invalid: InvalidPhoneNumbers })
    )
    PeopleDataEditing.currentPerson = Object.values(CorrectPhoneNumbers)[0]
    PeopleDataEditing.data = InvalidPhoneNumbers

    const InvalidPhoneNumbersKeys = Object.keys(InvalidPhoneNumbers)

    handlePeopleDataEditing('currentPerson', Object.values(PeopleDataEditing.data)[0])
    handlePeopleDataEditing('data', PeopleDataEditing.data)
    handlePeopleDataEditing('maxPage', InvalidPhoneNumbersKeys.length - 1)

    handlePeopleDataEditing('amount', {
      Correct: Object.keys(CorrectPhoneNumbers).length,
      Invalid: InvalidPhoneNumbersKeys.length
    })

    handlePeopleDataEditing('page', 0)

    setEditingData(true)
    setIsEditingData(true)
  }

  const handlePage = (pageIvl: number) => {
    const newPage = PeopleDataEditing.page + pageIvl

    if (newPage >= 0 && newPage <= PeopleDataEditing.maxPage) {
      handlePeopleDataEditing('page', newPage)
      handlePeopleDataEditing('currentPerson', Object.values(PeopleDataEditing.data)[newPage])
    }
  }

  const handleUpdatePerson = () => {
    const newPhone = document.getElementById('newPhone') as HTMLInputElement
    const newPhoneValue = newPhone.value.replace(/[^\d]/g, '')

    if (newPhoneValue || newPhoneValue.length < 1) {
      const currentPerson = PeopleDataEditing.currentPerson as Person
      const newData = { ...PeopleDataEditing.data }

      const indexOfPerson = Object.keys(newData).find((key) => newData[key] === currentPerson)

      if (indexOfPerson !== undefined) {
        const updatedPerson = {
          ...currentPerson,
          Phone: newPhoneValue
        }

        newData[indexOfPerson] = updatedPerson

        handlePeopleDataEditing('data', newData)
        handlePeopleDataEditing('currentPerson', updatedPerson)

        handlePage(1)
      } else {
        alert('Ocorreu um erro ao atualizar os dados')
      }
    } else {
      alert('Insira um número de telefone válido')
    }
  }

  const handleFinish = () => {
    const CurrentData = PeopleDataEditing.data
    const FailedPeople = []

    for (let key in CurrentData) {
      let PersonData = CurrentData[key]
      let Phone = PersonData?.Phone

      if (!Phone.startsWith('85') && Phone.length > 0) {
        FailedPeople.push(PersonData.Name)
      }
    }

    if (FailedPeople.length > 0) {
      return alert(
        `Existem ${
          FailedPeople.length
        } pessoas com números de telefone inválidos!!\n\n${FailedPeople.join('\n')}`
      )
    }

    setFinalizingData(true)
  }

  const ArrowButton = ({ ...props }) => {
    const ArrowType = props?.type ?? null

    if (ArrowType === 'back' || ArrowType === 'next') {
      return (
        <button
          className="p-3 pr-4 pl-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
          onClick={() => handlePage(ArrowType === 'back' ? -1 : 1)}>
          {ArrowType === 'back' ? '<' : '>'}
        </button>
      )
    }
  }

  const ListOfPeopleDataEdited = () => {
    return Object.values(PeopleDataEditing.data).map((person: Person, key: number) => {
      return (
        <div key={key} className="flex flex-col w-6/12 text-sm font-medium">
          <span>CPF: {person.CPF}</span>
          <span>Nome: {person.Name}</span>
          <span>Telefone: {person.Phone ? person.Phone : 'Sem telefone'}</span>
        </div>
      )
    })
  }

  const finished = (type: string) => {
    const FullData: Person[] = Object.values(
      Object.assign(
        JSON.parse(localStorage.getItem('PeopleNumbers') || '{}').Correct,
        PeopleDataEditing.data
      )
    )

    navigator.clipboard.writeText(
      (type === 'success'
        ? FullData.filter((person) => {
            return person.Phone.startsWith('85')
          })
        : FullData.filter((person) => {
            return !person.Phone.startsWith('85')
          })
      )
        .map((personData) => {
          return `${personData.Name}	${personData.Phone}`
        })
        .join('\n')
    )
  }

  const ContentManager = () => {
    setTimeout(() => {
      if (TextAreaRef?.current) {
        TextAreaRef.current.value = localStorage.getItem('PeopleContent') || ''
      }
    }, 1)

    if (finalizingData) {
      return (
        <div className="w-[90vw] md:w-6/12 flex flex-col items-center">
          <h1 className="text-xl mb-2 font-bold">Confira os dados</h1>
          <div className="flex flex-col text-sm h-96 w-full border-2 border-solid border-slate-700 rounded-sm">
            <div className="flex flex-row justify-between p-2 w-full bg-slate-400 text-white">
              <span>Válidos: {PeopleDataEditing.amount.Correct}</span>
              <span>
                Total: {PeopleDataEditing.amount.Correct + PeopleDataEditing.amount.Invalid}
              </span>
              <span>Inválidos: {PeopleDataEditing.amount.Invalid}</span>
            </div>

            <div className="flex flex-col text-sm p-3 h-96 w-full overflow-y-scroll items-center gap-2">
              <ListOfPeopleDataEdited />
            </div>
          </div>
          <div className="flex flex-row w-full mt-2 justify-between">
            <button
              className="p-2 pr-4 pl-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
              onClick={() => setFinalizingData(false)}>
              Voltar
            </button>
            <div className="flex flex-row items-center gap-2">
              <button
                className="p-2 md:p-2 md:pr-4 md:pl-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300"
                onClick={() => finished('success')}>
                C/ Válidos
              </button>
              <button
                className="p-2 md:p-2 md:pr-4 md:pl-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
                onClick={() => finished('fail')}>
                C/ Inváidos
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (editingData) {
      return (
        <div className="flex items-center flex-col text-sm w-[90vw] md:w-3/5 h-auto">
          <div
            className="w-full border-2 border-solid border-slate-700 
              rounded-md h-96">
            <div className="p-2 pl-3 pr-3 flex flex-row justify-between w-full bg-slate-400 text-white">
              <span>Editando dados</span>
              <div className="flex flex-row gap-2">
                <span>Inválidos: {PeopleDataEditing.amount.Invalid}</span>
                <span>Válidos: {PeopleDataEditing.amount.Correct}</span>
                <span>
                  Total: {PeopleDataEditing.amount.Correct + PeopleDataEditing.amount.Invalid}
                </span>
              </div>
            </div>

            <div className="text-base flex flex-col mt-10 items-center">
              <span
                onClick={() => {
                  navigator.clipboard.writeText(PeopleDataEditing.currentPerson?.CPF || '')
                  clearCopyState()
                  handleCopyState('CPF', true)
                }}
                className="w-fit p-1 -mb-1 transition duration-300 rounded-md cursor-pointer hover:bg-slate-100">
                CPF: {PeopleDataEditing.currentPerson?.CPF || ''} {copyState.CPF && '- 📝'}
              </span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(PeopleDataEditing.currentPerson?.Name || '')
                  clearCopyState()
                  handleCopyState('Name', true)
                }}
                className="w-fit p-1 -mb-1 transition duration-300 rounded-md cursor-pointer hover:bg-slate-100">
                Nome: {PeopleDataEditing.currentPerson?.Name || ''} {copyState.Name && '- 📝'}
              </span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(PeopleDataEditing.currentPerson?.Phone || '')
                  clearCopyState()
                  handleCopyState('Phone', true)
                }}
                className="w-fit p-1 -mb-1 transition duration-300 rounded-md cursor-pointer hover:bg-slate-100">
                Telefone:{' '}
                {PeopleDataEditing.currentPerson?.Phone || ''
                  ? PeopleDataEditing.currentPerson?.Phone
                  : 'Sem telefone'}{' '}
                {copyState.Phone && '- 📝'}
              </span>

              <div className="flex flex-col items-center mt-8">
                <label htmlFor="newPhone">Novo Telefone:</label>
                <input
                  ref={NewPhoneInputRef}
                  type="text"
                  id="newPhone"
                  className="text-center w-48 outline-none rounded-sm border border-solid border-slate-700 p-1"
                />
              </div>
            </div>
          </div>

          <div className="h-16 w-full flex flex-row items-center justify-between">
            <button
              className="p-3 pr-1 pl-1 md:pr-3 md:pl-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
              onClick={() => setEditingData(false)}>
              Voltar
            </button>
            <div className="flex flex-row gap-2 mr-1">
              {PeopleDataEditing.page === PeopleDataEditing.maxPage && (
                <button
                  className="p-3 pr-4 pl-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
                  onClick={handleFinish}>
                  Finalizar
                </button>
              )}

              <ArrowButton type="back" />
              <ArrowButton type="next" />
              <button
                className="p-3 pr-4 pl-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
                onClick={handleUpdatePerson}>
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <>
          <textarea
            ref={TextAreaRef}
            style={{ height: '26rem' }}
            spellCheck="false"
            className="text-sm p-3 w-[90vw] md:w-3/5 border-2 border-solid border-slate-700 
            rounded-md resize-none outline-none overflow"
          />
          <div>
            <button
              className="p-3 pr-4 pl-4 m-5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
              onClick={ProcessorHandler}>
              Processar {isEditingData ? 'novamente' : 'dados'}
            </button>
            {isEditingData && (
              <button
                className="p-3 pr-4 pl-4 m-5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
                onClick={() => setEditingData(true)}>
                Retomar edição
              </button>
            )}
          </div>
        </>
      )
    }
  }

  return (
    <div>
      <Header />

      <div className="flex flex-col items-center mt-12">
        <div className="w-10/12 flex flex-row justify-center">
          <div className="w-full text-center">
            <h1 className="text-3xl font-extrabold leading-10">Processador de dados</h1>
            <div className="flex items-center flex-col w-full h-auto mt-12">
              <ContentManager />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
